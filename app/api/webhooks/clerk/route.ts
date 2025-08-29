import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function POST(req: NextRequest) {
  // Verify the webhook signature
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  const { id, email_addresses, first_name, last_name, created_at, updated_at } = evt.data;

  console.log(`Webhook event: ${eventType} for user ${id}`);

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(id, email_addresses, first_name, last_name, created_at);
        break;
      case 'user.updated':
        await handleUserUpdated(id, email_addresses, first_name, last_name, updated_at);
        break;
      case 'user.deleted':
        await handleUserDeleted(id);
        break;
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error processing webhook ${eventType}:`, error);
    return new NextResponse(`Error processing ${eventType}`, {
      status: 500,
    });
  }

  return new NextResponse('Webhook processed successfully', { status: 200 });
}

async function handleUserCreated(
  userId: string,
  emailAddresses: any[],
  firstName: string,
  lastName: string,
  createdAt: number
) {
  const primaryEmail = emailAddresses.find(email => email.id === emailAddresses[0]?.id)?.email_address;
  
  // Insert into users table
  const userStmt = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, first_name, last_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  userStmt.run(userId, primaryEmail, firstName, lastName, createdAt, Date.now());

  // Create employee profile with default values
  const profileStmt = db.prepare(`
    INSERT OR IGNORE INTO employee_profiles (user_id, approval_id, approval_expires_at, active)
    VALUES (?, ?, ?, ?)
  `);
  
  // Set default approval expiry to 1 year from now
  const defaultExpiryDate = Date.now() + (365 * 24 * 60 * 60 * 1000);
  
  profileStmt.run(userId, `TEMP-${userId.slice(-8)}`, defaultExpiryDate, true);

  console.log(`User ${userId} (${primaryEmail}) created successfully`);
}

async function handleUserUpdated(
  userId: string,
  emailAddresses: any[],
  firstName: string,
  lastName: string,
  updatedAt: number
) {
  const primaryEmail = emailAddresses.find(email => email.id === emailAddresses[0]?.id)?.email_address;
  
  const stmt = db.prepare(`
    UPDATE users 
    SET email = ?, first_name = ?, last_name = ?, updated_at = ?
    WHERE id = ?
  `);
  
  stmt.run(primaryEmail, firstName, lastName, updatedAt, userId);
  console.log(`User ${userId} updated successfully`);
}

async function handleUserDeleted(userId: string) {
  // In a production system, you might want to soft delete or archive the user
  // For now, we'll deactivate the employee profile but keep the user record for audit purposes
  
  const stmt = db.prepare(`
    UPDATE employee_profiles 
    SET active = false 
    WHERE user_id = ?
  `);
  
  stmt.run(userId);
  console.log(`User ${userId} deactivated successfully`);
}
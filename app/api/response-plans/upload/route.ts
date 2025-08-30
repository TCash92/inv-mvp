import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import db from '../../../../lib/db';
import { isTestingMode, getMockAuth } from '../../../../lib/test-auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf'];

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    let userId: string | null = null;

    if (isTestingMode()) {
      const mockAuth = getMockAuth();
      userId = mockAuth?.userId || 'test-user-id';
      console.log('TESTING_MODE: true');
      console.log('Testing mode: bypassing auth for response plans upload');
    } else {
      const { userId: clerkUserId } = auth();
      userId = clerkUserId;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const planType = formData.get('planType') as string;

    if (!file || !planType) {
      return NextResponse.json(
        { error: 'File and plan type are required' },
        { status: 400 }
      );
    }

    // Validate plan type
    if (!['fire', 'security', 'erap'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${planType}-plan-${timestamp}.pdf`;
    const filePath = join(process.cwd(), 'public', 'response-plans', fileName);

    // Save file to filesystem
    await writeFile(filePath, buffer);

    // Deactivate previous plans of the same type
    const deactivatePrevious = db.prepare(`
      UPDATE response_plans 
      SET is_active = false 
      WHERE plan_type = ? AND is_active = true
    `);
    deactivatePrevious.run(planType);

    // Insert new plan record
    const insertPlan = db.prepare(`
      INSERT INTO response_plans (
        plan_type, file_name, file_path, file_size, 
        uploaded_at, uploaded_by_user_id, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Get the next version number
    const getMaxVersion = db.prepare(`
      SELECT COALESCE(MAX(version), 0) as max_version 
      FROM response_plans 
      WHERE plan_type = ?
    `);
    const { max_version } = getMaxVersion.get(planType) as { max_version: number };
    const newVersion = max_version + 1;

    const result = insertPlan.run(
      planType,
      fileName,
      `/response-plans/${fileName}`,
      file.size,
      timestamp,
      userId,
      newVersion
    );

    return NextResponse.json({
      success: true,
      plan: {
        id: result.lastInsertRowid,
        plan_type: planType,
        file_name: fileName,
        file_path: `/response-plans/${fileName}`,
        file_size: file.size,
        uploaded_at: timestamp,
        version: newVersion,
        is_active: true
      }
    });

  } catch (error) {
    console.error('Error uploading response plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
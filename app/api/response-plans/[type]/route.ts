import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import db from '../../../../lib/db';
import { isTestingMode, getMockAuth } from '../../../../lib/test-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    // Authentication check
    let userId: string | null = null;

    if (isTestingMode()) {
      const mockAuth = getMockAuth();
      userId = mockAuth?.userId || 'test-user-id';
      console.log('TESTING_MODE: true');
      console.log(`Testing mode: bypassing auth for response plan ${params.type}`);
    } else {
      const { userId: clerkUserId } = auth();
      userId = clerkUserId;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planType = params.type;

    // Validate plan type
    if (!['fire', 'security', 'erap'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Get the active plan for this type
    const getPlan = db.prepare(`
      SELECT * FROM response_plans 
      WHERE plan_type = ? AND is_active = true 
      ORDER BY uploaded_at DESC 
      LIMIT 1
    `);
    
    const plan = getPlan.get(planType) as any;

    if (!plan) {
      return NextResponse.json(
        { error: 'No active plan found for this type' },
        { status: 404 }
      );
    }

    // Log access for audit purposes
    const logAccess = db.prepare(`
      INSERT INTO audit_logs (
        timestamp, actor_user_id, action, entity, entity_id, details
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    logAccess.run(
      Date.now(),
      userId,
      'response_plan.accessed',
      'response_plans',
      plan.id,
      JSON.stringify({ plan_type: planType })
    );

    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        plan_type: plan.plan_type,
        file_name: plan.file_name,
        file_path: plan.file_path,
        file_size: plan.file_size,
        uploaded_at: plan.uploaded_at,
        version: plan.version
      }
    });

  } catch (error) {
    console.error('Error retrieving response plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    // Authentication check
    let userId: string | null = null;

    if (isTestingMode()) {
      const mockAuth = getMockAuth();
      userId = mockAuth?.userId || 'test-user-id';
      console.log('TESTING_MODE: true');
      console.log(`Testing mode: bypassing auth for response plan deletion ${params.type}`);
    } else {
      const { userId: clerkUserId } = auth();
      userId = clerkUserId;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planType = params.type;

    // Validate plan type
    if (!['fire', 'security', 'erap'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Deactivate the plan (soft delete)
    const deactivatePlan = db.prepare(`
      UPDATE response_plans 
      SET is_active = false 
      WHERE plan_type = ? AND is_active = true
    `);

    const result = deactivatePlan.run(planType);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'No active plan found to delete' },
        { status: 404 }
      );
    }

    // Log deletion for audit purposes
    const logDeletion = db.prepare(`
      INSERT INTO audit_logs (
        timestamp, actor_user_id, action, entity, entity_id, details
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    logDeletion.run(
      Date.now(),
      userId,
      'response_plan.deactivated',
      'response_plans',
      null,
      JSON.stringify({ plan_type: planType })
    );

    return NextResponse.json({
      success: true,
      message: `${planType} plan deactivated successfully`
    });

  } catch (error) {
    console.error('Error deleting response plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
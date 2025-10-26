import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { serverEnv } from '@/constants/server-env';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = serverEnv.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // 헤더 가져오기
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // 페이로드 가져오기
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Webhook 검증
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook 검증 실패:', err);
    return new Response('Webhook verification failed', { status: 400 });
  }

  const supabase = createAdminClient();

  // user.created 이벤트 처리
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;
    const name = [last_name, first_name].filter(Boolean).join('') || email?.split('@')[0] || 'Unknown';

    // @ts-ignore - Supabase type inference issue
    const { error } = await supabase.from('users').insert([{
      id,
      email: email || '',
      name,
    }]);

    if (error) {
      console.error('사용자 생성 실패:', error);
      return new Response('User creation failed', { status: 500 });
    }
  }

  // user.updated 이벤트 처리
  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;
    const name = [last_name, first_name].filter(Boolean).join('') || email?.split('@')[0] || 'Unknown';

    // @ts-ignore - Supabase type inference issue
    const { error } = await supabase
      .from('users')
      // @ts-ignore - Supabase type inference issue
      .update({
        email: email || '',
        name,
      })
      .eq('id', id);

    if (error) {
      console.error('사용자 업데이트 실패:', error);
      return new Response('User update failed', { status: 500 });
    }
  }

  return new Response('Webhook processed', { status: 200 });
}

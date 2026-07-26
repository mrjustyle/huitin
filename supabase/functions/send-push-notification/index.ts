import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import admin from "npm:firebase-admin@11.11.0";

// Ensure Firebase is initialized only once
if (!admin.apps.length) {
  try {
    const serviceAccountStr = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountStr) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is not set in environment variables');
    }
    const serviceAccount = JSON.parse(serviceAccountStr);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized.");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    // We expect this to be called via Database Webhook when a row is inserted into `notifications`
    // The payload format from Supabase Webhook:
    // { type: 'INSERT', table: 'notifications', record: { user_id, title, message, ... } }
    
    if (payload.type !== 'INSERT' || payload.table !== 'notifications') {
      return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const notification = payload.record;
    
    // Create Supabase client to fetch push tokens
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch tokens for the user
    const { data: tokensData, error: tokensError } = await supabaseClient
      .from('user_push_tokens')
      .select('fcm_token')
      .eq('user_id', notification.user_id);

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      throw tokensError;
    }

    if (!tokensData || tokensData.length === 0) {
      console.log(`No push tokens found for user ${notification.user_id}`);
      return new Response(JSON.stringify({ message: 'No tokens found' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const tokens = tokensData.map(t => t.fcm_token);
    
    // Send via Firebase Admin
    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        link: notification.link || '/',
        notification_id: notification.id,
      },
      tokens: tokens, // Multicast message
    };

    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`Successfully sent ${response.successCount} messages; Failed ${response.failureCount} messages.`);
    
    // Cleanup invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      
      if (failedTokens.length > 0) {
        await supabaseClient
          .from('user_push_tokens')
          .delete()
          .in('fcm_token', failedTokens);
        console.log(`Deleted ${failedTokens.length} invalid tokens.`);
      }
    }

    return new Response(JSON.stringify({ success: true, response }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

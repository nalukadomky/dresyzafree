import { supabaseAdmin } from './supabase-server';
import { supabase } from './supabase';

const client = supabaseAdmin ?? supabase;

export const dbFeedback = {
  submit: async (teamId: string, featureRequest: string | null, emojiRating: number | null): Promise<void> => {
    const { error } = await client!
      .from('feedback')
      .insert({
        team_id: teamId,
        feature_request: featureRequest || null,
        emoji_rating: emojiRating || null,
      });
    if (error) throw new Error(error.message);
  },
};

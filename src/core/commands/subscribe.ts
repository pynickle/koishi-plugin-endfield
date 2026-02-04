import { Config } from '../../config/config';
import { Context, Session } from 'koishi';

export async function endfieldSubscribe(ctx: Context, session: Session, cfg: Config, time: string) {
  try {
    const bindings = await ctx.database.get('endfield_bindings_v3', session.userId);

    if (bindings.length === 0) {
      return session.text('endfield.notBoundError');
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return session.text('.invalidTime');
    }

    // Check if user already has a subscription
    const existingSubscriptions = await ctx.database.get('endfield_subscriptions', session.userId);

    if (existingSubscriptions.length > 0) {
      const existingSubscription = existingSubscriptions[0];

      // Check if subscription is in a different group
      if (existingSubscription.group_id !== session.channelId) {
        return session.text('.differentGroup', {
          existingTime: existingSubscription.time,
          existingGroup: existingSubscription.group_id,
        });
      } else {
        // Update existing subscription
        await ctx.database.set('endfield_subscriptions', session.userId, {
          time,
          updated_at: new Date().toISOString(),
        });
        return session.text('.updateSuccess', {
          time,
        });
      }
    } else {
      // Create new subscription
      await ctx.database.create('endfield_subscriptions', {
        user_id: session.userId,
        group_id: session.channelId,
        time,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return session.text('.createSuccess', {
        time,
      });
    }
  } catch (error) {
    ctx.logger.error('Endfield subscribe error:', error);
    return session.text('endfield.networkError');
  }
}

export async function endfieldUnsubscribe(ctx: Context, session: Session, cfg: Config) {
  try {
    const existingSubscriptions = await ctx.database.get('endfield_subscriptions', session.userId);

    if (existingSubscriptions.length === 0) {
      return session.text('.noSubscription');
    }

    await ctx.database.remove('endfield_subscriptions', session.userId);
    return session.text('.unsubscribeSuccess');
  } catch (error) {
    ctx.logger.error('Endfield unsubscribe error:', error);
    return session.text('endfield.networkError');
  }
}

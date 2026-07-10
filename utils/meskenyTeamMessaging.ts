import { MESKENY_TEAM_USER_ID } from "../constants";

export function isMeskenyTeamConversation(conv: {
  other_user_id?: number;
  is_meskeny_team?: boolean;
}): boolean {
  return Boolean(conv.is_meskeny_team) || conv.other_user_id === MESKENY_TEAM_USER_ID;
}

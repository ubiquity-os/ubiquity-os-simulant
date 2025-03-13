import { EmailMessage } from "@cloudflare/workers-types";
import { acceptCollaboratorInvitation } from "./handlers/invites";
import { Env } from "./types";

export default {
  async email(message: EmailMessage & { headers: { get: (s: string) => string } }, env: Env) {
    if (message.from === "noreply@github.com") {
      const subject = message.headers.get("subject");
      const reg = new RegExp(/invited you to (\S+\/\S+)/, "i");
      const matches = reg.exec(subject);
      if (matches) {
        const [owner, repo] = matches[1].split("/");
        await acceptCollaboratorInvitation(owner, repo, env);
      }
    }
  },
};

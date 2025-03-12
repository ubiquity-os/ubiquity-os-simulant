import { EmailMessage } from "@cloudflare/workers-types";
import { customOctokit } from "@ubiquity-os/plugin-sdk/octokit";
import { Env } from "./types";

export async function acceptCollaboratorInvitation(owner: string, name: string, env: Env) {
  const userOctokit = new customOctokit({
    auth: env.USER_GITHUB_TOKEN,
  });
  const { data } = await userOctokit.rest.repos.listInvitationsForAuthenticatedUser();
  const invite = data.find((o) => o.repository.owner.login === owner && o.repository.name === name);
  if (invite?.id) {
    await userOctokit.rest.repos.acceptInvitationForAuthenticatedUser({
      invitation_id: invite.id,
    });
  }
}

export default {
  async email(message: EmailMessage & { headers: { get: (s: string) => string } }, env: Env) {
    console.log(JSON.stringify(message));
    console.log("Received email from:", message.from);
    console.log("To:", message.to);
    if (message.from === "noreply@github.com") {
      const subject = message.headers.get("subject");
      const reg = new RegExp(/invited you to (\S+\/\S+)/, "i");
      const matches = reg.exec(subject);
      if (matches) {
        const [owner, repo] = matches[1].split("/");
        await acceptCollaboratorInvitation(owner, repo, env);
        // await message.forward("ubiquity-os-simulant@ubq.fi");
      }
    } else {
      // message.setReject(`Unknown address ${message.to}`);
    }
  },
};

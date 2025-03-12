import { EmailMessage } from "@cloudflare/workers-types";
// import { customOctokit } from "@ubiquity-os/plugin-sdk/octokit";
import { Env } from "./types";

// export async function acceptCollaboratorInvitation(owner: string, name: string, env: Env) {
//   const userOctokit = new customOctokit({
//     auth: env.USER_GITHUB_TOKEN,
//   });
//   const { data } = await userOctokit.rest.repos.listInvitationsForAuthenticatedUser();
//   const invite = data.find((o) => o.repository.owner.login === owner && o.repository.name === name);
//   if (invite?.id) {
//     await userOctokit.rest.repos.acceptInvitationForAuthenticatedUser({
//       invitation_id: invite.id,
//     });
//   }
// }

type Invitation = {
  repository?: {
    owner: {
      login: string;
    };
    name: string;
  };
};

export default {
  async email(message: EmailMessage & { headers: { get: (s: string) => string } }, env: Env) {
    if (message.from === "noreply@github.com") {
      const subject = message.headers.get("subject");
      const reg = new RegExp(/invited you to (\S+\/\S+)/, "i");
      const matches = reg.exec(subject);
      if (matches) {
        const [owner, repo] = matches[1].split("/");
        const invitationsResponse = await fetch("https://api.github.com/user/repository_invitations", {
          headers: {
            Authorization: `token ${env.USER_GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Cloudflare-Worker",
          },
        });
        const invitations = await invitationsResponse.json();
        const invitation = invitations.find(
          (inv: Invitation) =>
            inv.repository && inv.repository.owner.login.toLowerCase() === owner.toLowerCase() && inv.repository.name.toLowerCase() === repo.toLowerCase()
        );
        if (!invitation) {
          console.log(`No pending invitation found for ${owner}/${repo}`);
          return;
        }
        await fetch(`https://api.github.com/user/repository_invitations/${invitation.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `token ${env.USER_GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Cloudflare-Worker",
          },
        });
      }
    }
  },
};

// export default {
//   async email(message, env) {
//     if (message.from === "noreply@github.com") {
//       const subject = message.headers.get("subject");
//       const reg = new RegExp(/invited you to (\S+\/\S+)/, "i");
//       const matches = reg.exec(subject);
//       if (matches) {
//         const [owner, repo] = matches[1].split("/");
//         const invitationsResponse = await fetch("https://api.github.com/user/repository_invitations", {
//           headers: {
//             "Authorization": `token ${env.USER_GITHUB_TOKEN}`,
//             "Accept": "application/vnd.github.v3+json",
//             "User-Agent": "Cloudflare-Worker"
//           }
//         });
//         const invitations = await invitationsResponse.json();
//         const invitation = invitations.find(inv =>
//           inv.repository &&
//           inv.repository.owner.login.toLowerCase() === owner.toLowerCase() &&
//           inv.repository.name.toLowerCase() === repo.toLowerCase()
//         );
//         if (!invitation) {
//           console.log(`No pending invitation found for ${owner}/${repo}`);
//           return;
//         }
//         await fetch(`https://api.github.com/user/repository_invitations/${invitation.id}`, {
//           method: "PATCH",
//           headers: {
//             "Authorization": `token ${env.USER_GITHUB_TOKEN}`,
//             "Accept": "application/vnd.github.v3+json",
//             "User-Agent": "Cloudflare-Worker"
//           }
//         });
//       }
//     }
//   }
// };

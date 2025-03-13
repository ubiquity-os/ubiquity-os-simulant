import { afterAll, afterEach, beforeAll, beforeEach, describe, it, jest } from "@jest/globals";
import { drop } from "@mswjs/data";
import dotenv from "dotenv";
import { db } from "./__mocks__/db";
import { setupTests } from "./__mocks__/helpers";
import { server } from "./__mocks__/node";

dotenv.config();

beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

describe("Plugin tests", () => {
  beforeEach(async () => {
    jest.resetAllMocks();
    drop(db);
    await setupTests();
  });

  it("Should handle an email issued by GitHub", async () => {
    const acceptCollaboratorInvitation = jest.fn();
    const owner = "owner";
    const repo = "repo";
    const env = { USER_GITHUB_TOKEN: "1234" };

    jest.unstable_mockModule("../src/handlers/invites", () => ({
      acceptCollaboratorInvitation: acceptCollaboratorInvitation,
    }));
    const { email } = (await import("../src/index")).default;

    // Will ignore an email with the wrong sender
    await email({ from: "test@test.com", headers: { get: () => `invited you to ${owner}/${repo}` }, to: "" }, env);
    expect(acceptCollaboratorInvitation).not.toHaveBeenCalled();

    // Will ignore an email with the wrong subject
    await email({ from: "noreply@github.com", headers: { get: () => "" }, to: "" }, env);
    expect(acceptCollaboratorInvitation).not.toHaveBeenCalled();

    // Will proceed with an email of the form 'invited you to owner/repo'
    await email({ from: "noreply@github.com", headers: { get: () => `invited you to ${owner}/${repo}` }, to: "" }, env);
    expect(acceptCollaboratorInvitation).toHaveBeenCalledWith(owner, repo, env);
  });
});

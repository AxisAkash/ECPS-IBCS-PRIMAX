import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default function ApplicantWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell workspace="workspace">{children}</WorkspaceShell>;
}

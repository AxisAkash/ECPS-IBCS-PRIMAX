import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default function RajukWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell workspace="rajuk">{children}</WorkspaceShell>;
}

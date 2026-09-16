import React from "react";
import MessagesPage from "../Shared/Messages.page";

// Thin wrapper so Messages is reachable at /admin/messages — the shared component is
// already role-agnostic (user-to-user messaging, not scoped to Family/Caretaker/Elder),
// so nothing else is needed here.
const AdminMessagesPage: React.FC = () => <MessagesPage />;

export default AdminMessagesPage;

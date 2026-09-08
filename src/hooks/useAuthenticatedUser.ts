import { useContext } from "react";
import { AuthenticatedUserContext } from "../contexts/AuthenticatedUserContext";

export const useAuthenticatedUser = () => useContext(AuthenticatedUserContext);

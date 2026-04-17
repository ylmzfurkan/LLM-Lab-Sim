import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

export function UserMenu() {
  return (
    <Avatar className="h-7 w-7">
      <AvatarFallback>
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
}

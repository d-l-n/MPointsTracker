import { useState } from "react";

interface AvatarUser {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

interface UserAvatarProps {
  user: AvatarUser;
}

export default function UserAvatar({ user }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = (user.displayName || user.email || "?")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (user.photoURL && !failed) {
    return (
      <img
        className="user-avatar"
        src={user.photoURL}
        alt={user.displayName || ""}
        title={user.displayName || ""}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return <div className="user-avatar-placeholder" title={user.displayName || ""}>{initials}</div>;
}

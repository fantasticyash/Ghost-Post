import { Models } from "@/types";
import { Link } from "react-router-dom";

import { Button } from "../ui/button";
import { useUserContext } from "@/context/AuthContext";
import { useFollowUser } from "@/lib/react-query/queries";

type UserCardProps = {
  user: Models.Document;
};

const UserCard = ({ user }: UserCardProps) => {
  const { user: currentUser } = useUserContext();
  const { mutate: followUser, isPending } = useFollowUser();

  const isSelf = currentUser.id === user.$id;
  const isFollowing =
    Array.isArray(user.followers) && user.followers.includes(currentUser.id);

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelf || isPending) return;
    followUser({ currentUserId: currentUser.id, targetUserId: user.$id });
  };

  return (
    <Link to={`/profile/${user.$id}`} className="user-card">
      <img
        src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
        alt="creator"
        className="rounded-full w-14 h-14 object-cover"
      />

      <div className="flex-center flex-col gap-1">
        <p className="base-medium text-light-1 text-center line-clamp-1">
          {user.name}
        </p>
        <p className="small-regular text-light-3 text-center line-clamp-1">
          @{user.username}
        </p>
      </div>

      {!isSelf && (
        <Button
          type="button"
          size="sm"
          className={`${
            isFollowing
              ? "bg-dark-4 hover:bg-dark-3 text-light-1 border border-dark-4"
              : "shad-button_primary"
          } px-5`}
          onClick={handleFollow}
          disabled={isPending}
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </Button>
      )}
    </Link>
  );
};

export default UserCard;

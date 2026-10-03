import { useState } from "react";
import Loader from "@/components/shared/Loader";
import UserCard from "@/components/shared/UserCard";
import { useGetUsers } from "@/lib/react-query/queries";

const People = () => {
  const { data: users, isLoading } = useGetUsers();
  const [searchValue, setSearchValue] = useState("");

  const filteredUsers = users?.documents.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="common-container">
      <div className="user-container">
        <h2 className="h3-bold md:h2-bold text-left w-full">Find People</h2>

        <div className="flex gap-1 px-4 w-full rounded-lg bg-dark-4">
          <img
            src="/assets/icons/search.svg"
            width={24}
            height={24}
            alt="search"
          />
          <input
            type="text"
            placeholder="Search people..."
            className="explore-search w-full p-3 rounded-md bg-transparent border-none text-light-1 focus:outline-none"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {isLoading ? (
          <Loader />
        ) : (
          <ul className="user-grid">
            {filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <li key={user.$id} className="flex-1 min-w-[200px] w-full">
                  <UserCard user={user} />
                </li>
              ))
            ) : (
              <p className="text-light-4 mt-10 text-center w-full">
                No users found
              </p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default People;

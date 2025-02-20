import { useEffect, useState } from "react";
import Loader from "../../components/shared/Loader";
import { useGetUsers } from "../../lib/react-query/queries";

const People = () => {
  const { data: users, isLoading } = useGetUsers();
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const debounce = setTimeout(() => {
      // Implement search functionality here
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchValue]);

  return (
    <div className="people-container w-full p-5">
      <div className="flex justify-center items-center w-full  mt-8 mb-7">
        <h2 className="flex items-center justify-center  font-extrabold w-full  text-4xl">
          Find People
        </h2>
      </div>

      <div className="flex flex-wrap gap-3 w-full px-5  mb-12 ">
        <input
          type="text"
          placeholder="Search people"
          className="explore-search w-full p-3 rounded-md"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Loader />
      ) : (
        <ul className="grid-container">
          {users?.documents.map((user) => (
            <li key={user.$id} className="user-card">
              <img
                src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
                alt="creator"
                className="rounded-full w-14 h-14"
              />
              <div className="flex flex-col">
                <p className="base-medium text-light-1 text-center line-clamp-1">
                  {user.name}
                </p>
                <p className="small-regular text-light-3 text-center line-clamp-1">
                  @{user.username}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default People;

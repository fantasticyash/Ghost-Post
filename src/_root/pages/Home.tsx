import PostCard from "@/components/shared/PostCard";
import { useGetRecentPosts } from "@/lib/react-query/queries";
import { Models } from "appwrite";
import { Loader } from "lucide-react";

const Home = () => {
  const { data: posts, isPending: isPostLoading } = useGetRecentPosts();

  return (
    <div className="flex flex-1 ">
      <div className="home-container">
        <div className="home-posts ">
          <h2 className=" font-extrabold text-4xl text-center w-full">
            Home Feed
          </h2>
        </div>
        {isPostLoading && !posts ? (
          <Loader />
        ) : (
          <ul className="grid md:grid-cols-2 grid-cols-1 flex-1 gap-9 w-full items-center justify-center">
            {posts?.documents.map((post: Models.Document) => (
              <PostCard post={post} key={post.caption} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Home;

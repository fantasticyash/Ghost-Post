import { Models } from "@/types";
import GridPostList from "./GridPostList";
import Loader from "./Loader";

type SearchResultsProps = {
  isSearchFetching: boolean;
  searchedPosts: Models.DocumentList<Models.Document> | undefined;
};

const SearchResults = ({
  isSearchFetching,
  searchedPosts,
}: SearchResultsProps) => {
  if (isSearchFetching) return <Loader />;

  if (searchedPosts && searchedPosts.documents.length > 0) {
    return <GridPostList posts={searchedPosts.documents} />;
  }

  return (
    <p className="text-light-4 mt-10 text-center w-full">No results found</p>
  );
};

export default SearchResults;

import BottomBar from "@/components/shared/BottomBar";
import LeftsideBar from "@/components/shared/LeftsideBar";
import Topbar from "@/components/shared/Topbar";
import Loader from "@/components/shared/Loader";
import { Outlet, Navigate } from "react-router-dom";
import { useUserContext } from "@/context/AuthContext";

const RootLayout = () => {
  const { isAuthenticated, isLoading } = useUserContext();

  if (isLoading) {
    return (
      <div className="flex-center w-full h-screen bg-dark-1">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="w-full md:flex">
      <Topbar />
      <LeftsideBar />
      <section className="flex flex-1 h-full">
        <Outlet />
      </section>
      <BottomBar />
    </div>
  );
};

export default RootLayout;

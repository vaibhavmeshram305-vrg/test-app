import { Redirect } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { Loader } from "@/src/components/Loader";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader text="Loading PVDesign AI..." />;
  }

  return user ? (
    <Redirect href="/(tabs)" />
  ) : (
    <Redirect href="/(auth)/welcome" />
  );
}
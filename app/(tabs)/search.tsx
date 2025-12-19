import { Redirect, useLocalSearchParams } from "expo-router";

// Redirect /search to / (index) since search is now the default/home route
export default function SearchRedirect() {
  const { category, query } = useLocalSearchParams<{
    query?: string;
    category?: string;
  }>();

  // Preserve query params when redirecting
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (query) params.set("query", query);

  const queryString = params.toString();
  const redirectPath = queryString ? `/?${queryString}` : "/";

  return <Redirect href={redirectPath as any} />;
}

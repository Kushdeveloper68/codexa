import ErrorState from "../components/ErrorState";

export default function NotFoundPage() {
  return <ErrorState type="not-found" message="This page doesn't exist." />;
}

/* eslint-disable @typescript-eslint/consistent-type-imports */
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronLeft } from "lucide-react";
import { trpc } from "../../utils/trpc";
import { Button } from "../../components/ui/button";
import MediaDetailPage from "../../components/Media/MediaDetailPage";

const SqlShowDetailPage = () => {
  const { query } = useRouter();
  const id = query.id as string;

  const { data: show, isLoading } = trpc.show.get.useQuery(
    { id },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="text-2xl font-bold">Show not found</h2>
        <Button asChild variant="outline">
          <Link href="/show">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Shows
          </Link>
        </Button>
      </div>
    );
  }

  return <MediaDetailPage media={show} type="show" />;
};

export default SqlShowDetailPage;

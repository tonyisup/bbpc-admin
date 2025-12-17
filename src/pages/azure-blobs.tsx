import { useState, useMemo } from 'react';
import Head from 'next/head';
import { trpc } from '../utils/trpc';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, FileIcon, Database, ChevronRight, ChevronLeft, RefreshCw, Download, Play } from 'lucide-react';
import { format } from 'date-fns';

export default function AzureBlobsPage() {
	const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
	const [continuationToken, setContinuationToken] = useState<string | undefined>(undefined);
	const [tokenHistory, setTokenHistory] = useState<string[]>([]);
	const [pageSize, setPageSize] = useState<number>(20);

	// Queries
	const { data: containers, isLoading: isLoadingContainers } = trpc.azure.listContainers.useQuery();

	const {
		data: blobData,
		isLoading: isLoadingBlobs,
		isFetching: isFetchingBlobs,
		refetch: refetchBlobs
	} = trpc.azure.listBlobs.useQuery(
		{
			containerName: selectedContainer || '',
			continuationToken,
			pageSize
		},
		{
			enabled: !!selectedContainer,
			keepPreviousData: true
		}
	);

	// Handlers
	const handleContainerChange = (value: string) => {
		setSelectedContainer(value);
		setContinuationToken(undefined);
		setTokenHistory([]);
	};

	const handleNextPage = () => {
		if (blobData?.nextContinuationToken) {
			setTokenHistory(prev => [...prev, continuationToken || '']);
			setContinuationToken(blobData.nextContinuationToken);
		}
	};

	const handlePrevPage = () => {
		if (tokenHistory.length > 0) {
			const prevToken = tokenHistory[tokenHistory.length - 1];
			setContinuationToken(prevToken === '' ? undefined : prevToken);
			setTokenHistory(prev => prev.slice(0, -1));
		}
	};

	const formatBytes = (bytes: number, decimals = 2) => {
		if (!+bytes) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	};

	const triggerUploadWorkflow = trpc.azure.triggerUploadWorkflow.useMutation({
		onSuccess: () => {
			alert("Workflow triggered successfully!");
		},
		onError: (error) => {
			alert(`Error triggering workflow: ${error.message}`);
		}
	});

	const utils = trpc.useContext();

	const handleStartWorkflow = async (blob: any) => {
		if (!selectedContainer) return;

		if (confirm(`Are you sure you want to trigger the audio chapterizer workflow for "${blob.name}"?`)) {
			triggerUploadWorkflow.mutate({
				containerName: selectedContainer,
				blobName: blob.name
			});
		}
	};

	const handleDownloadBlob = async (blob: any) => {
		if (!selectedContainer) return;
		try {
			// Use the helper directly to fetch the URL for download
			const result = await utils.azure.getBlobUrl.fetch({
				containerName: selectedContainer,
				blobName: blob.name
			});
			if (result?.url) {
				window.open(result.url, '_blank');
			}
		} catch (e) {
			console.error("Failed to get blob URL", e);
			alert("Failed to get download URL");
		}
	};

	// Determine effective container list
	const containerList = useMemo(() => containers || [], [containers]);

	// Set default container if none selected and list is loaded
	if (!selectedContainer && containerList.length > 0 && containerList[0] !== undefined) {
		setSelectedContainer(containerList[0]);
	}

	return (
		<div className="min-h-screen bg-gray-900 text-gray-100 p-8">
			<Head>
				<title>Azure Storage Explorer | BBPC Admin</title>
			</Head>

			<div className="max-w-7xl mx-auto space-y-6">

				{/* Header Section */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
							Storage Explorer
						</h1>
						<p className="text-gray-400 mt-1">Browse and manage your Azure Blob Storage assets.</p>
					</div>

					<div className="flex items-center gap-3 bg-gray-800/50 p-2 rounded-lg border border-gray-700">
						<Database className="w-4 h-4 text-blue-400 ml-2" />
						<span className="text-sm font-medium text-gray-300">Container:</span>
						<div className="w-[200px]">
							<Select
								value={selectedContainer || ''}
								onValueChange={handleContainerChange}
								disabled={isLoadingContainers}
							>
								<SelectTrigger className="bg-gray-900 border-gray-600 h-8 text-xs">
									<SelectValue placeholder={isLoadingContainers ? "Loading..." : "Select Container"} />
								</SelectTrigger>
								<SelectContent className="bg-gray-800 border-gray-700">
									{containerList.map((c) => (
										<SelectItem key={c} value={c} className="text-gray-200 focus:bg-gray-700 cursor-pointer">
											{c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<Card className="bg-gray-800 border-gray-700 shadow-xl overflow-hidden">
					<CardHeader className="border-b border-gray-700 pb-4 bg-gray-800/80 backdrop-blur">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-lg text-gray-100 flex items-center gap-2">
									{selectedContainer ? (
										<>
											<FileIcon className="w-5 h-5 text-cyan-400" />
											{selectedContainer}
										</>
									) : 'Select a container'}
								</CardTitle>
								<CardDescription className="text-gray-400">
									{blobData?.blobs ? `${blobData.blobs.length} items shown` : 'Waiting for selection...'}
								</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => refetchBlobs()}
									className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300"
									disabled={isFetchingBlobs}
								>
									<RefreshCw className={`w-4 h-4 ${isFetchingBlobs ? 'animate-spin' : ''}`} />
								</Button>
							</div>
						</div>
					</CardHeader>

					<CardContent className="p-0">
						<div className="relative min-h-[400px]">
							{isLoadingBlobs ? (
								<div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 z-10">
									<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
								</div>
							) : null}

							<Table>
								<TableHeader className="bg-gray-900/50">
									<TableRow className="border-gray-700 hover:bg-transparent">
										<TableHead className="text-gray-400 w-[40%]">Name</TableHead>
										<TableHead className="text-gray-400 w-[15%]">Actions</TableHead>
										<TableHead className="text-gray-400">Content Type</TableHead>
										<TableHead className="text-gray-400 text-right">Size</TableHead>
										<TableHead className="text-gray-400 text-right">Last Modified</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{blobData?.blobs && blobData.blobs.length > 0 ? (
										blobData.blobs.map((blob) => (
											<TableRow key={blob.name} className="border-gray-700 hover:bg-gray-700/50 transition-colors">
												<TableCell className="font-medium text-gray-200">
													<div className="flex items-center gap-2">
														<FileIcon className="w-4 h-4 text-gray-500" />
														<span className="truncate max-w-[300px]" title={blob.name}>{blob.name}</span>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1">
														<Button
															variant="ghost"
															size="sm"
															className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
															onClick={() => handleDownloadBlob(blob)}
															title="Download"
														>
															<Download className="w-4 h-4" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
															onClick={() => handleStartWorkflow(blob)}
															title="Start Workflow"
														>
															<Play className="w-4 h-4" />
														</Button>
													</div>
												</TableCell>
												<TableCell className="text-gray-400">{blob.contentType}</TableCell>
												<TableCell className="text-gray-300 text-right font-mono text-xs">
													{formatBytes(blob.contentLength ?? 0)}
												</TableCell>
												<TableCell className="text-gray-400 text-right text-xs">
													{format(new Date(blob.lastModified), 'MMM d, yyyy HH:mm')}
												</TableCell>
											</TableRow>
										))
									) : (
										!isLoadingBlobs && (
											<TableRow className="border-gray-700">
												<TableCell colSpan={4} className="h-24 text-center text-gray-500">
													No blobs found in this container.
												</TableCell>
											</TableRow>
										)
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>

					{/* Pagination Footer */}
					<div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-800/80">
						<div className="text-sm text-gray-400">
							Page {tokenHistory.length + 1}
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handlePrevPage}
								disabled={tokenHistory.length === 0 || isLoadingBlobs}
								className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200 disabled:opacity-50"
							>
								<ChevronLeft className="w-4 h-4 mr-1" />
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleNextPage}
								disabled={!blobData?.nextContinuationToken || isLoadingBlobs}
								className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200 disabled:opacity-50"
							>
								Next
								<ChevronRight className="w-4 h-4 ml-1" />
							</Button>
						</div>
					</div>
				</Card>

			</div>
		</div>
	);
}

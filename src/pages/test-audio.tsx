import React, { useState } from 'react';
import { useAudioSession } from '../hooks/useAudioSession';
import AudioStream from '../components/AudioStream';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import Head from 'next/head';

const TestAudioPage = () => {
	const {
		isAudioSessionActive,
		connectedUsers,
		initializeAudioSession,
		toggleMute,
		isMuted,
		remoteStreams,
		disconnect,
		kickUser
	} = useAudioSession();

	const [name, setName] = useState("");

	return (
		<div className="min-h-screen bg-gray-900 text-white p-8">
			<Head>
				<title>Audio Test | BBPC Admin</title>
			</Head>
			<div className="max-w-2xl mx-auto space-y-8">
				<header>
					<h1 className="text-3xl font-bold mb-2">Audio Session Test</h1>
					<p className="text-gray-400">Test the multi-user audio session functionality standalone.</p>
				</header>

				{!isAudioSessionActive ? (
					<div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
						<label className="block mb-2 text-sm font-medium">Enter your name to join</label>
						<div className="flex gap-2">
							<Input
								placeholder="e.g. Tony"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="bg-gray-700 border-gray-600"
							/>
							<Button onClick={() => initializeAudioSession(name)} disabled={!name}>
								Join Session
							</Button>
						</div>
					</div>
				) : (
					<div className="space-y-6">
						<div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-green-900/50">
							<div className="flex items-center gap-3">
								<span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
								<span className="font-semibold text-green-400">Session Active</span>
							</div>
							<div className="flex gap-2">
								<Button onClick={toggleMute} variant={isMuted ? "destructive" : "secondary"}>
									{isMuted ? "Unmute Microphone" : "Mute Microphone"}
								</Button>
								<Button onClick={disconnect} variant="destructive">
									End Session
								</Button>
							</div>
						</div>

						<div className="grid gap-6 md:grid-cols-2">
							<div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
								<h2 className="font-semibold mb-4 text-xl flex items-center gap-2">
									Users <span className="text-xs bg-gray-700 px-2 py-1 rounded ml-auto">{connectedUsers.length}</span>
								</h2>
								{connectedUsers.length === 0 ? (
									<p className="text-gray-500 italic">No other users connected.</p>
								) : (
									<ul className="space-y-2">
										{connectedUsers.map(user => (
											<li key={user.id} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded">
												<div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">
													{user.info.name.charAt(0).toUpperCase()}
												</div>
												<div className="flex-1">
													<span>{user.info.name}</span>
													{user.info.isGuest && <span className="text-xs text-gray-400 ml-2">(Guest)</span>}
												</div>
												<Button
													size="sm"
													variant="ghost"
													className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
													onClick={() => kickUser(user.id)}
												>
													Remove
												</Button>
											</li>
										))}
									</ul>
								)}
							</div>

							<div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
								<h2 className="font-semibold mb-4 text-xl flex items-center gap-2">
									Audio Streams <span className="text-xs bg-gray-700 px-2 py-1 rounded ml-auto">{remoteStreams.length}</span>
								</h2>
								{remoteStreams.length === 0 ? (
									<p className="text-gray-500 italic">No active audio streams.</p>
								) : (
									<div className="space-y-2">
										{remoteStreams.map(rs => (
											<div key={rs.peerId} className="p-3 bg-gray-700/50 rounded flex items-center justify-between">
												<span className="text-sm font-mono text-gray-400">ID: {rs.peerId.substring(0, 8)}...</span>
												<div className="h-2 w-2 rounded-full bg-green-500" />
												<AudioStream stream={rs.stream} />
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default TestAudioPage;

import { useState, useRef, useEffect, useCallback } from "react";
import Pusher, { Members } from "pusher-js";
import SimplePeer, { Instance as PeerInstance } from "simple-peer";

export interface ConnectedUser {
	id: string;
	info: {
		name: string;
		isGuest: boolean;
	};
}

export interface RemoteStream {
	peerId: string;
	stream: MediaStream;
}

export const useAudioSession = () => {
	// State
	const [isAudioSessionActive, setIsAudioSessionActive] = useState(false);
	const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
	const [myStream, setMyStream] = useState<MediaStream | null>(null);
	const [isMuted, setIsMuted] = useState(false);
	const [me, setMe] = useState<ConnectedUser | null>(null);
	const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);

	// Refs
	const pusherRef = useRef<Pusher | null>(null);
	const peersRef = useRef<{ [key: string]: PeerInstance }>({});
	const userRef = useRef<ConnectedUser | null>(null);
	const channelRef = useRef<any>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const addRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
		setRemoteStreams(prev => {
			if (prev.find(s => s.peerId === peerId)) return prev;
			return [...prev, { peerId, stream }];
		});
	}, []);

	const removeRemoteStream = useCallback((peerId: string) => {
		setRemoteStreams(prev => prev.filter(s => s.peerId !== peerId));
	}, []);

	const disconnect = useCallback(() => {
		if (channelRef.current && pusherRef.current) {
			channelRef.current.unsubscribe();
			channelRef.current = null;
		}
		Object.values(peersRef.current).forEach(peer => peer.destroy());
		peersRef.current = {};

		if (streamRef.current) {
			streamRef.current.getTracks().forEach(track => track.stop());
			streamRef.current = null;
		}

		setMyStream(null);
		setConnectedUsers([]);
		setRemoteStreams([]);
		setIsAudioSessionActive(false);
		setMe(null);
	}, []);

	const kickUser = useCallback((targetId: string) => {
		// 1. Send signal to target to disconnect themselves
		const currentUserId = userRef.current?.id;
		if (currentUserId) {
			try {
				fetch("/api/pusher/signal", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						signal: "kick",
						to: targetId,
						from: currentUserId,
					}),
				});
			} catch (err) {
				console.error("Failed to send kick signal", err);
			}
		}

		// 2. Disconnect them locally
		const peer = peersRef.current[targetId];
		if (peer) {
			peer.destroy();
			delete peersRef.current[targetId];
		}
		setConnectedUsers(prev => prev.filter(u => u.id !== targetId));
		removeRemoteStream(targetId);
	}, [removeRemoteStream]);

	const createPeer = (targetId: string, myId: string, stream: MediaStream) => {
		const peer = new SimplePeer({
			initiator: true,
			trickle: false,
			stream: stream,
		});

		peer.on("signal", (signal: any) => {
			fetch("/api/pusher/signal", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					signal,
					to: targetId,
					from: myId,
				}),
			});
		});

		peer.on("stream", (remoteStream: MediaStream) => {
			addRemoteStream(targetId, remoteStream);
		});

		peersRef.current[targetId] = peer;
	};

	const addPeer = (incomingSignal: any, callerId: string, stream: MediaStream) => {
		const peer = new SimplePeer({
			initiator: false,
			trickle: false,
			stream: stream,
		});

		peer.on("signal", (signal: any) => {
			fetch("/api/pusher/signal", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					signal,
					to: callerId,
					from: userRef.current?.id,
				}),
			});
		});

		peer.on("stream", (remoteStream: MediaStream) => {
			addRemoteStream(callerId, remoteStream);
		});

		peer.signal(incomingSignal);
		peersRef.current[callerId] = peer;
	};

	const initializeAudioSession = async (name: string) => {
		try {
			// 1. Get Microphone Access
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
			setMyStream(stream);
			streamRef.current = stream;

			// 2. Initialize Pusher
			const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
			const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

			if (!pusherKey || !pusherCluster) {
				throw new Error("Pusher configuration is missing. Check NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER.");
			}

			const pusherInstance = new Pusher(pusherKey, {
				cluster: pusherCluster,
				authEndpoint: "/api/pusher/auth",
				auth: {
					params: {
						username: name
					}
				}
			});

			pusherRef.current = pusherInstance;

			// 3. Subscribe to Presence Channel
			const channel = pusherInstance.subscribe("presence-audio");
			channelRef.current = channel;

			channel.bind("pusher:subscription_succeeded", (members: Members) => {
				const activeUsers: ConnectedUser[] = [];
				members.each((member: any) => {
					if (member.id !== members.me.id) {
						activeUsers.push({ id: member.id, info: member.info });
					}
				});
				setConnectedUsers(activeUsers);
				const myInfo = { id: members.me.id, info: members.me.info };
				userRef.current = myInfo;
				setMe(myInfo);
			});

			channel.bind("pusher:member_added", (member: any) => {
				setConnectedUsers((prev) => [...prev, { id: member.id, info: member.info }]);
				// Existing members call the new member
				const currentUserId = userRef.current?.id;
				if (currentUserId) {
					createPeer(member.id, currentUserId, stream);
				}
			});

			channel.bind("pusher:member_removed", (member: any) => {
				setConnectedUsers((prev) => prev.filter((u) => u.id !== member.id));
				removeRemoteStream(member.id);
				const peer = peersRef.current[member.id];
				if (peer) {
					peer.destroy();
					delete peersRef.current[member.id];
				}
			});

			// Handle Signaling
			channel.bind("signal", (data: any) => {
				if (data.to === userRef.current?.id) {
					if (data.signal === 'kick') {
						alert("You have been removed from the session.");
						disconnect();
						return;
					}

					const peer = peersRef.current[data.from];
					if (peer) {
						peer.signal(data.signal);
					} else {
						addPeer(data.signal, data.from, stream);
					}
				}
			});

			setIsAudioSessionActive(true);

		} catch (err) {
			console.error("Failed to initialize audio session:", err);
			alert("Could not access microphone or connect to server.");
		}
	};

	const toggleMute = () => {
		if (streamRef.current) {
			streamRef.current.getAudioTracks().forEach(track => {
				track.enabled = !track.enabled;
			});
			const firstTrack = streamRef.current.getAudioTracks()[0];
			if (firstTrack) {
				setIsMuted(!firstTrack.enabled);
			}
		}
	};

	useEffect(() => {
		// Cleanup on unmount
		return () => {
			disconnect();
		};
	}, [disconnect]);

	return {
		isAudioSessionActive,
		connectedUsers,
		myStream,
		isMuted,
		remoteStreams,
		initializeAudioSession,
		toggleMute,
		me,
		disconnect,
		kickUser
	};
};

export const createSignalHandlers = ({
  peerManager,
  sendSignal,
  room_id,
  selfId,
}) => 
    {

        const handleOffer = async ({ from, payload }) => {
            const pc = peerManager.createPeer(from);

            await pc.setRemoteDescription(payload);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await sendSignal({
            room_id,
            from_user: selfId,
            to_user: from,
            type: "answer",
            payload: answer
            });

            await peerManager.flushCandidateQueue(from);
        };

        const handleAnswer = async ({ from, payload }) => {
            const pc = peerManager.getPeer(from);
            if (!pc) return;

            await pc.setRemoteDescription(payload);
            await peerManager.flushCandidateQueue(from);
        };

        const handleIce = async ({ from, payload }) => {
            const pc = peerManager.getPeer(from);

            if (!pc || !pc.remoteDescription) {
            peerManager.queueCandidate(from, payload);
            return;
            }

            try {
            await pc.addIceCandidate(payload);
            } catch (e) {
            peerManager.queueCandidate(from, payload);
            }
        };

        const handleSignal = async (signal) => {
            switch (signal.type) {
            case "offer":
                return handleOffer(signal);
            case "answer":
                return handleAnswer(signal);
            case "ice":
                return handleIce(signal);
            }
        };

        return { handleSignal };
    };
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useConnection } from "wagmi";
import { apiGet, apiPost } from "../lib/api";

const FALLBACK = [
  {
    id: "AIP-003",
    title: "Lower the hnvUSD LTV from 70% to 65%",
    description: "Tighten the maximum borrow against HNVWA.",
    forPct: 72,
    againstPct: 28,
    forVotes: 72,
    againstVotes: 28,
    ballots: 0,
    voted: false,
    support: null,
    status: "active",
  },
];

export function GovernancePage() {
  const connection = useConnection();
  const address = connection.address || "";
  const [selectedId, setSelectedId] = useState(FALLBACK[0].id);
  const [message, setMessage] = useState("");
  const list = useQuery({
    queryKey: ["proposals", address],
    queryFn: () => apiGet(`/governance/proposals${address ? `?address=${address}` : ""}`),
  });
  const proposals = list.data?.length ? list.data : FALLBACK;
  const activeId = proposals.some((item) => item.id === selectedId) ? selectedId : proposals[0].id;
  const detail = useQuery({
    queryKey: ["proposal", activeId, address],
    queryFn: () => apiGet(`/governance/proposals/${activeId}${address ? `?address=${address}` : ""}`),
    enabled: Boolean(activeId),
  });
  const listed = proposals.find((item) => item.id === activeId) || proposals[0];
  const proposal = detail.data || listed;

  async function vote(support) {
    setMessage("");
    const result = await apiPost(`/governance/proposals/${proposal.id}/vote`, { support, address });
    if (result.ok || result.status === 409) {
      await Promise.all([list.refetch(), detail.refetch()]);
    }
    if (result.ok) setMessage(support ? "Vote for recorded." : "Vote against recorded.");
    else if (result.status === 409) setMessage("This address already voted.");
    else setMessage(result.data?.error || "The desk could not record the vote.");
  }

  const voteLabel = proposal.voted
    ? proposal.support
      ? "Voted for"
      : "Voted against"
    : "";

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Governance</p>
          <h1>Parameter votes</h1>
          <p className="lede">A change to LTV or the liquidation threshold reprices every open line. Each address votes once, for or against.</p>
        </div>
      </header>
      <div className="proposal-list">
        {proposals.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === proposal.id ? "btn" : "btn secondary"}
            onClick={() => {
              setSelectedId(item.id);
              setMessage("");
            }}
          >
            {item.id}
          </button>
        ))}
      </div>
      <article className="proposal">
        <div className="proposal-top">
          <span className="pill is-live">{proposal.status === "active" ? "Active" : proposal.status}</span>
          <span className="asset-token">{proposal.id}</span>
        </div>
        <h2>{proposal.title}</h2>
        <p className="lede">{proposal.description}</p>
        <div className="vote-pair">
          <div>
            <div className="vote-meta">
              <span>For</span>
              <b>{proposal.forPct}%</b>
            </div>
            <div className="vote-bar" aria-hidden="true">
              <span style={{ width: `${proposal.forPct}%` }} />
            </div>
          </div>
          <div>
            <div className="vote-meta">
              <span>Against</span>
              <b>{proposal.againstPct}%</b>
            </div>
            <div className="vote-bar is-nay" aria-hidden="true">
              <span style={{ width: `${proposal.againstPct}%` }} />
            </div>
          </div>
        </div>
        <p className="note">
          {proposal.forVotes} for · {proposal.againstVotes} against
          {proposal.ballots ? ` · ${proposal.ballots} saved from this desk` : ""}
          {voteLabel ? ` · ${voteLabel}` : ""}
        </p>
        {message && <p className="note">{message}</p>}
        <div className="actions">
          <button type="button" className="btn" disabled={!address || proposal.voted} onClick={() => vote(true)}>
            {!address ? "Connect to vote" : proposal.voted ? "Vote recorded" : "Vote for"}
          </button>
          <button type="button" className="btn secondary" disabled={!address || proposal.voted} onClick={() => vote(false)}>
            {!address ? "Connect to vote" : "Vote against"}
          </button>
        </div>
      </article>
    </>
  );
}

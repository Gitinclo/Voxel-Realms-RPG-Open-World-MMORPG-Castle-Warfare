/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Inbox,
  Mail,
  MailOpen,
  Plus,
  RefreshCw,
  Search,
  Send,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  GmailApiError,
  GmailLabel,
  GmailMessageSummary,
  createGmailDraft,
  createGmailLabel,
  listGmailLabels,
  listGmailMessages,
  modifyGmailMessageLabels,
  sendGmailMessage,
  trashGmailMessage,
} from '../lib/gmail';

interface GmailModalProps {
  commanderName: string;
  castleLevel: number;
  allianceTag: string;
  activeAccountEmail?: string;
  onClose: () => void;
}

type PendingGmailMutation =
  | {
      type: 'send';
      title: string;
      description: string;
      confirmLabel: string;
      to: string;
      subject: string;
      body: string;
    }
  | {
      type: 'draft';
      title: string;
      description: string;
      confirmLabel: string;
      to: string;
      subject: string;
      body: string;
    }
  | {
      type: 'trash';
      title: string;
      description: string;
      confirmLabel: string;
      messageId: string;
    }
  | {
      type: 'toggle_read';
      title: string;
      description: string;
      confirmLabel: string;
      messageId: string;
      markRead: boolean;
    }
  | {
      type: 'create_label';
      title: string;
      description: string;
      confirmLabel: string;
      labelName: string;
    };

export const GmailModal: React.FC<GmailModalProps> = ({
  commanderName,
  castleLevel,
  allianceTag,
  activeAccountEmail = 'creatergame31@gmail.com',
  onClose,
}) => {
  const {
    user,
    workspaceAccessToken,
    needsWorkspaceAuth,
    isSigningIn,
    authError,
    signInWithGoogle,
    clearWorkspaceAccessToken,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  const [selectedLabel, setSelectedLabel] = useState<string>('INBOX');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [composeTo, setComposeTo] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');
  const [newLabelName, setNewLabelName] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<PendingGmailMutation | null>(null);

  const handleApiFailure = useCallback(
    (err: unknown) => {
      if (err instanceof GmailApiError && (err.status === 401 || err.status === 403)) {
        clearWorkspaceAccessToken();
        setStatusBanner({
          type: 'error',
          text: 'Your Gmail session expired or lacks mailbox permission. Please sign in with Google again.',
        });
        return;
      }
      setStatusBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to complete Gmail request.',
      });
    },
    [clearWorkspaceAccessToken]
  );

  const loadMailbox = useCallback(async () => {
    if (!workspaceAccessToken) return;
    setIsLoading(true);
    setStatusBanner(null);
    try {
      const [fetchedLabels, fetchedMessages] = await Promise.all([
        listGmailLabels(workspaceAccessToken),
        listGmailMessages(workspaceAccessToken, {
          labelId: selectedLabel,
          query: searchQuery,
          maxResults: 12,
        }),
      ]);
      setLabels(fetchedLabels);
      setMessages(fetchedMessages);
      setSelectedMessage((prev) =>
        prev
          ? (fetchedMessages.find((m) => m.id === prev.id) ?? fetchedMessages[0] ?? null)
          : (fetchedMessages[0] ?? null)
      );
    } catch (err) {
      handleApiFailure(err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceAccessToken, selectedLabel, searchQuery, handleApiFailure]);

  useEffect(() => {
    if (workspaceAccessToken) {
      void loadMailbox();
    }
  }, [workspaceAccessToken, loadMailbox]);

  const requestSendEmail = () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      setStatusBanner({
        type: 'error',
        text: 'Recipient, subject, and message body are required before sending.',
      });
      return;
    }
    setPendingAction({
      type: 'send',
      title: 'Confirm Sending Email',
      description: `Send this email from your Gmail account to "${composeTo.trim()}" with subject "${composeSubject.trim()}"?`,
      confirmLabel: 'Confirm & Send Email',
      to: composeTo.trim(),
      subject: composeSubject.trim(),
      body: composeBody,
    });
  };

  const requestSaveDraft = () => {
    if (!composeSubject.trim() && !composeBody.trim()) {
      setStatusBanner({
        type: 'error',
        text: 'Add a subject or body before creating a Gmail draft.',
      });
      return;
    }
    setPendingAction({
      type: 'draft',
      title: 'Confirm Saving Draft',
      description: `Create a new Gmail draft${composeTo.trim() ? ` addressed to "${composeTo.trim()}"` : ''}${composeSubject.trim() ? ` titled "${composeSubject.trim()}"` : ''}?`,
      confirmLabel: 'Confirm & Save Draft',
      to: composeTo.trim(),
      subject: composeSubject.trim() || '(No Subject)',
      body: composeBody,
    });
  };

  const requestTrashMessage = (msg: GmailMessageSummary) => {
    setPendingAction({
      type: 'trash',
      title: 'Confirm Moving Message to Trash',
      description: `Move the email "${msg.subject}" from ${msg.from} to Gmail Trash?`,
      confirmLabel: 'Confirm Move to Trash',
      messageId: msg.id,
    });
  };

  const requestToggleRead = (msg: GmailMessageSummary) => {
    const markRead = msg.isUnread;
    setPendingAction({
      type: 'toggle_read',
      title: markRead ? 'Confirm Marking as Read' : 'Confirm Marking as Unread',
      description: `Update Gmail labels on "${msg.subject}" to mark it as ${markRead ? 'read' : 'unread'}?`,
      confirmLabel: markRead ? 'Confirm Mark Read' : 'Confirm Mark Unread',
      messageId: msg.id,
      markRead,
    });
  };

  const requestCreateLabel = () => {
    const trimmed = newLabelName.trim();
    if (!trimmed) return;
    setPendingAction({
      type: 'create_label',
      title: 'Confirm Creating Gmail Label',
      description: `Create a new custom Gmail label named "${trimmed}" in your mailbox?`,
      confirmLabel: 'Confirm Create Label',
      labelName: trimmed,
    });
  };

  const executeConfirmedAction = async () => {
    if (!pendingAction || !workspaceAccessToken) return;
    setIsMutating(true);
    setStatusBanner(null);
    const action = pendingAction;
    setPendingAction(null);

    try {
      if (action.type === 'send') {
        await sendGmailMessage(workspaceAccessToken, {
          to: action.to,
          subject: action.subject,
          body: action.body,
        });
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setActiveTab('inbox');
        setStatusBanner({ type: 'success', text: `Email sent to ${action.to}.` });
        await loadMailbox();
      } else if (action.type === 'draft') {
        await createGmailDraft(workspaceAccessToken, {
          to: action.to,
          subject: action.subject,
          body: action.body,
        });
        setStatusBanner({ type: 'success', text: `Draft "${action.subject}" saved in Gmail.` });
        await loadMailbox();
      } else if (action.type === 'trash') {
        await trashGmailMessage(workspaceAccessToken, action.messageId);
        setSelectedMessage(null);
        setStatusBanner({ type: 'success', text: 'Message moved to Gmail Trash.' });
        await loadMailbox();
      } else if (action.type === 'toggle_read') {
        await modifyGmailMessageLabels(workspaceAccessToken, action.messageId, {
          addLabelIds: action.markRead ? [] : ['UNREAD'],
          removeLabelIds: action.markRead ? ['UNREAD'] : [],
        });
        setStatusBanner({
          type: 'success',
          text: `Message marked as ${action.markRead ? 'read' : 'unread'}.`,
        });
        await loadMailbox();
      } else if (action.type === 'create_label') {
        const created = await createGmailLabel(workspaceAccessToken, action.labelName);
        setNewLabelName('');
        setStatusBanner({ type: 'success', text: `Created Gmail label "${created.name}".` });
        await loadMailbox();
      }
    } catch (err) {
      handleApiFailure(err);
    } finally {
      setIsMutating(false);
    }
  };

  const fillAllianceTemplate = () => {
    setComposeSubject(
      `[${allianceTag}] War Dispatch from ${commanderName} (Castle Lv.${castleLevel})`
    );
    setComposeBody(
      `Greetings Commander,\n\nStatus Report from Citadel ${commanderName} [${allianceTag}] (Castle Lv.${castleLevel}):\n- Rally readiness confirmed.\n- Supply lines active across Sector B2.\n\nFor the Realm!`
    );
  };

  const systemLabels = [
    { id: 'INBOX', name: 'Inbox' },
    { id: 'SENT', name: 'Sent' },
    { id: 'DRAFT', name: 'Drafts' },
    { id: 'STARRED', name: 'Starred' },
    { id: 'TRASH', name: 'Trash' },
  ];
  const customLabels = labels.filter((l) => l.type === 'user').slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6">
      <div className="relative w-full max-w-5xl h-[88vh] flex flex-col rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40">
              <Mail className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black font-cinzel text-amber-300">
                Gmail Dispatch Center
              </h2>
              <p className="text-xs text-slate-400">
                {user?.email
                  ? `Connected account: ${user.email}`
                  : `Commander Identity: ${activeAccountEmail} · Connect Google OAuth to access live Gmail`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {workspaceAccessToken && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'inbox'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Mailbox</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('compose')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'compose'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Compose</span>
                </button>
                <button
                  type="button"
                  onClick={() => void loadMailbox()}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer disabled:opacity-50"
                  title="Refresh Gmail"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              aria-label="Close Gmail Dispatch Center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {(statusBanner || authError) && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center justify-between gap-2 border-b ${
              statusBanner?.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {statusBanner?.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusBanner?.text || authError}</span>
            </span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-slate-300 hover:text-white font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Body */}
        {needsWorkspaceAuth || !workspaceAccessToken ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5 overflow-y-auto">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <Mail className="w-10 h-10 text-amber-400" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-bold font-cinzel text-amber-200">
                Connect Your Gmail Account
              </h3>
              <p className="text-sm text-slate-400">
                Sign in with Google to view your inbox, organize labels, save drafts, and send
                dispatches with your permission. Every email send, label change, or trash action
                asks for your confirmation first.
              </p>
            </div>
            <GoogleSignInButton
              onClick={() => {
                void signInWithGoogle({ includeGmailScopes: true });
              }}
              disabled={isSigningIn}
              label={isSigningIn ? 'Signing in...' : 'Sign in with Google'}
            />
            <div className="max-w-lg rounded-xl bg-slate-950/80 border border-amber-500/30 p-4 text-left space-y-2">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Seeing &ldquo;Google hasn&rsquo;t verified this app&rdquo;?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Because Gmail uses restricted mailbox scopes and your Google Cloud OAuth consent
                screen (<span className="font-mono text-amber-200">dev-ivy-6v0ns</span> /{' '}
                <span className="font-mono text-amber-200">creatergame31@gmail.com</span>) is in{' '}
                <span className="font-semibold text-white">Testing mode</span>, Google displays a
                developer test notice.
              </p>
              <ol className="text-xs text-slate-300 list-decimal list-inside space-y-1">
                <li>
                  Click <span className="font-bold text-amber-300">Continue</span> (or{' '}
                  <span className="font-semibold text-slate-200">Advanced &rarr; Go to app</span>)
                  on the Google popup.
                </li>
                <li>
                  Check <span className="font-bold text-amber-300">Select all</span> to grant Gmail
                  permissions and click <span className="font-bold text-amber-300">Continue</span>.
                </li>
              </ol>
              <p className="text-[11px] text-slate-400 pt-1">
                Note: Standard game &amp; Admin Console sign-in on the Title Screen now uses basic
                profile scopes so you can sign into your Commander account without triggering this
                screen.
              </p>
            </div>
          </div>
        ) : activeTab === 'compose' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold font-cinzel text-amber-200">Compose Email</h3>
              <button
                type="button"
                onClick={fillAllianceTemplate}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-xs font-semibold text-amber-300 cursor-pointer"
              >
                Insert Alliance Dispatch Template
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">To</label>
                <input
                  type="email"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 outline-none text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Alliance Dispatch Subject"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 outline-none text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Message</label>
                <textarea
                  rows={10}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your email message..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 outline-none text-sm text-slate-100 resize-y"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={requestSaveDraft}
                disabled={isMutating}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Archive className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                onClick={requestSendEmail}
                disabled={isMutating}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Send Email</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12">
            {/* Labels Sidebar */}
            <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-slate-800 p-3 flex flex-col gap-2 overflow-y-auto bg-slate-950/40">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 px-2">
                Folders
              </div>
              {systemLabels.map((lbl) => (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => setSelectedLabel(lbl.id)}
                  className={`px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    selectedLabel === lbl.id
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-200'
                      : 'hover:bg-slate-800/70 text-slate-300 border border-transparent'
                  }`}
                >
                  <span>{lbl.name}</span>
                </button>
              ))}

              {customLabels.length > 0 && (
                <>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 px-2 pt-2">
                    Custom Labels
                  </div>
                  {customLabels.map((lbl) => (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => setSelectedLabel(lbl.id)}
                      className={`px-3 py-1.5 rounded-xl text-left text-xs flex items-center gap-2 transition-all cursor-pointer ${
                        selectedLabel === lbl.id
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-200'
                          : 'hover:bg-slate-800/70 text-slate-300 border border-transparent'
                      }`}
                    >
                      <Tag className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{lbl.name}</span>
                    </button>
                  ))}
                </>
              )}

              <div className="pt-3 mt-auto border-t border-slate-800 space-y-2">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="New label name"
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={requestCreateLabel}
                    disabled={!newLabelName.trim() || isMutating}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 disabled:opacity-40 cursor-pointer"
                    title="Create Gmail Label"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Message List */}
            <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col min-h-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadMailbox();
                }}
                className="p-3 border-b border-slate-800 flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Gmail..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  Go
                </button>
              </form>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
                {isLoading && messages.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No messages found in this view.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => setSelectedMessage(msg)}
                      className={`w-full text-left p-3.5 transition-all cursor-pointer ${
                        selectedMessage?.id === msg.id
                          ? 'bg-amber-500/15 border-l-2 border-l-amber-400'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-xs truncate ${
                            msg.isUnread ? 'font-bold text-amber-200' : 'font-medium text-slate-300'
                          }`}
                        >
                          {msg.from}
                        </span>
                        {msg.isUnread && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                      </div>
                      <div
                        className={`text-xs truncate mb-1 ${
                          msg.isUnread ? 'font-bold text-white' : 'text-slate-200'
                        }`}
                      >
                        {msg.subject}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2">{msg.snippet}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Message Reader */}
            <div className="md:col-span-5 flex flex-col min-h-0 p-5 overflow-y-auto bg-slate-950/30">
              {selectedMessage ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-base font-bold text-amber-200 break-words">
                        {selectedMessage.subject}
                      </h4>
                      <div className="text-xs text-slate-300 break-all">
                        <span className="text-slate-500">From:</span> {selectedMessage.from}
                      </div>
                      {selectedMessage.to && (
                        <div className="text-xs text-slate-400 break-all">
                          <span className="text-slate-500">To:</span> {selectedMessage.to}
                        </div>
                      )}
                      {selectedMessage.date && (
                        <div className="text-[11px] text-slate-500">{selectedMessage.date}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => requestToggleRead(selectedMessage)}
                        disabled={isMutating}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                        title={selectedMessage.isUnread ? 'Mark as Read' : 'Mark as Unread'}
                      >
                        {selectedMessage.isUnread ? (
                          <MailOpen className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Mail className="w-4 h-4 text-amber-300" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => requestTrashMessage(selectedMessage)}
                        disabled={isMutating}
                        className="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition-all cursor-pointer"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-200 leading-relaxed break-words">
                    {selectedMessage.bodyText}
                  </pre>
                </div>
              ) : (
                <div className="m-auto text-center text-xs text-slate-500">
                  Select an email to read its contents.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mandatory Explicit Confirmation Dialog for Mutating/Destructive Gmail Actions */}
        {pendingAction && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/50 p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-bold font-cinzel text-amber-200">
                  {pendingAction.title}
                </h3>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">{pendingAction.description}</p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void executeConfirmedAction();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer ${
                    pendingAction.type === 'trash'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {pendingAction.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  SUPABASE_PROJECT_REF,
  SUPABASE_SQL_URL,
  SUPABASE_INIT_SQL,
  checkSupabaseHealth,
  SupabaseHealthStatus,
} from '../services/supabase';
import { sound } from '../services/soundEngine';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Server,
  Table,
  Check,
  CloudCheck,
} from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncTrigger: () => Promise<void>;
  isSyncing: boolean;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  onSyncTrigger,
  isSyncing,
}) => {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [health, setHealth] = useState<SupabaseHealthStatus | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const runHealthCheck = async () => {
    setChecking(true);
    try {
      const res = await checkSupabaseHealth();
      setHealth(res);
      return res;
    } catch {
      return null;
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
    }
  }, [isOpen]);

  const handleCopySQL = async () => {
    sound.playStepTick();
    try {
      await navigator.clipboard.writeText(SUPABASE_INIT_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = SUPABASE_INIT_SQL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCheckAndSync = async () => {
    sound.playStepTick();
    const updatedHealth = await runHealthCheck();
    await onSyncTrigger();
    if (updatedHealth?.allTablesReady) {
      sound.playStampThud();
      setSyncFeedback('✅ 同步成功！云端数据表与本地已完全一致');
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#FFFDF9] rounded-2xl shadow-2xl border border-[#EAE5DC] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#F8F5EE] border-b border-[#ECE7DC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Database size={16} />
            </div>
            <div>
              <h3 className="font-serif-vintage font-bold text-base text-[#2A2825] leading-tight">
                Supabase 数据库状态
              </h3>
              <p className="text-[11px] font-mono text-[#8C8578]">
                Project: {SUPABASE_PROJECT_REF}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playStepTick();
              onClose();
            }}
            className="p-1.5 text-[#8C8578] hover:text-[#2A2825] hover:bg-[#EAE5DC] rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Badge */}
          <div className="bg-[#FAF7F0] p-3.5 rounded-xl border border-[#E8E2D5] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#4A453E] flex items-center gap-1.5">
                <Server size={14} className="text-emerald-700" />
                数据库连接与数据表状态
              </span>
              <button
                onClick={runHealthCheck}
                disabled={checking}
                className="text-[11px] text-[#7C7569] hover:text-[#2A2825] flex items-center gap-1 cursor-pointer font-mono"
              >
                <RefreshCw size={11} className={checking ? 'animate-spin' : ''} />
                {checking ? '检测中...' : '刷新状态'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div
                className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 text-center ${
                  health?.habitsTableReady
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold">
                  <Table size={12} />
                  <span>habits</span>
                </div>
                <span className="text-[10px]">
                  {health?.habitsTableReady
                    ? `✅ ${health.habitsCount ?? 0} 条`
                    : '⚠️ 待建表'}
                </span>
              </div>

              <div
                className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 text-center ${
                  health?.ticketsTableReady
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold">
                  <Table size={12} />
                  <span>tickets</span>
                </div>
                <span className="text-[10px]">
                  {health?.ticketsTableReady
                    ? `✅ ${health.ticketsCount ?? 0} 张`
                    : '⚠️ 待建表'}
                </span>
              </div>

              <div
                className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 text-center ${
                  health?.settingsTableReady
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold">
                  <Table size={12} />
                  <span>settings</span>
                </div>
                <span className="text-[10px]">
                  {health?.settingsTableReady ? '✅ 偏好就绪' : '⚠️ 待建表'}
                </span>
              </div>
            </div>
          </div>

          {health?.allTablesReady ? (
            /* Tables Ready State */
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>连接成功！Supabase 数据库已完全就绪</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-700">
                已成功连通云端数据库（已同步 <strong>{health.habitsCount ?? 0}</strong> 条打卡习惯与 <strong>{health.ticketsCount ?? 0}</strong> 张实体票根），后续新增习惯、打卡与撕纸将自动实时双向同步。
              </p>
              {syncFeedback && (
                <div className="p-2 bg-emerald-100/90 text-emerald-900 rounded-lg text-xs font-medium flex items-center gap-1.5 animate-in fade-in duration-150">
                  <Sparkles size={13} className="text-emerald-700" />
                  <span>{syncFeedback}</span>
                </div>
              )}
            </div>
          ) : (
            /* Needs Setup State */
            <div className="space-y-3.5">
              <div className="bg-amber-50/80 border border-amber-200 text-amber-900 p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
                  <AlertCircle size={14} className="shrink-0 text-amber-600" />
                  <span>数据库表尚未初始化</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  你的 Supabase 项目密钥已连接！如果还没有执行建表 SQL，请在 Supabase SQL Editor 执行一次，10 秒内即可解决。
                </p>
              </div>

              {/* 3 Step Action Guide */}
              <div className="bg-white border border-[#EAE5DC] rounded-xl p-3.5 space-y-3">
                <h4 className="font-bold text-[#2A2825] text-xs flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-600" />
                  建表步骤：
                </h4>

                <div className="space-y-2 text-[11px] text-[#555]">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#2A2825] text-white flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      复制下方已经准备好的建表 SQL 代码（包含 <code>habits</code>、<code>slice_tickets</code>、<code>user_settings</code>）。
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#2A2825] text-white flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      点击「打开 SQL Editor」打开控制台，在代码框粘贴。
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#2A2825] text-white flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      点击右下角的绿色 <strong>Run</strong> (运行) 按钮，看到 Success 即完成！
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleCopySQL}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#2A2825] text-white font-medium text-xs hover:bg-[#3E3A35] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        <span className="text-emerald-300">已复制 SQL！</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>一键复制建表 SQL</span>
                      </>
                    )}
                  </button>

                  <a
                    href={SUPABASE_SQL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => sound.playStepTick()}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-700 text-white font-medium text-xs hover:bg-emerald-800 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <span>打开 SQL Editor</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* SQL Code Preview Collapsible */}
              <div className="border border-[#EAE5DC] rounded-xl overflow-hidden bg-[#242220] text-[#E8E6E3]">
                <div className="px-3 py-2 bg-[#1C1A18] border-b border-[#333] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#8C8578]">schema.sql (预览)</span>
                  <button
                    onClick={handleCopySQL}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
                <pre className="p-3 text-[10px] font-mono leading-relaxed overflow-x-auto max-h-36 text-neutral-300 select-all">
                  {SUPABASE_INIT_SQL}
                </pre>
              </div>
            </div>
          )}

          {/* Sync Trigger Bottom Action */}
          <div className="pt-2">
            <button
              onClick={handleCheckAndSync}
              disabled={isSyncing || checking}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 ${
                health?.allTablesReady
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                  : 'bg-[#F0ECE1] hover:bg-[#EAE4D7] text-[#2A2825] border border-[#DDD6C8]'
              }`}
            >
              <RefreshCw size={14} className={isSyncing || checking ? 'animate-spin' : ''} />
              <span>
                {isSyncing || checking
                  ? '正在同步中...'
                  : health?.allTablesReady
                  ? '立即全量双向同步云端'
                  : '检测连接并全量同步云端'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#FAF7F0] border-t border-[#ECE7DC] flex items-center justify-between text-[11px] text-[#8C8578]">
          <span>本地缓存兜底保障，断网或无表均不丢失数据</span>
          <button
            onClick={() => {
              sound.playStepTick();
              onClose();
            }}
            className="text-[#2A2825] font-semibold hover:underline cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft, Plus, RotateCcw, Trash2 } from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/data/categories";
import { getBankDataSource } from "@/lib/bank-data-source-factory";
import type { CustomTag, UserSettings } from "@/lib/bank-data-source";

type TagManagementScreenProps = {
  onClose: () => void;
};

type TagItem = {
  name: string;
  enabled: boolean;
  isCustom: boolean;
  customTagId?: string;
};

export function TagManagementScreen({ onClose }: TagManagementScreenProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-tag-screen-item]",
        { autoAlpha: 0, y: 18, scale: 0.985 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.42,
          ease: "power2.out",
          stagger: 0.055,
          clearProps: "all",
        },
      );
    }, screenRef);

    return () => ctx.revert();
  }, [tags.length]);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const ds = getBankDataSource();
      const [settings, customTags] = await Promise.all([
        ds.getUserSettings(),
        ds.getCustomTags(),
      ]);

      const enabled = settings.enabledCategories ?? [...EXPENSE_CATEGORIES];
      const builtIn: TagItem[] = EXPENSE_CATEGORIES.map((cat) => ({
        name: cat,
        enabled: enabled.includes(cat),
        isCustom: false,
      }));
      const custom: TagItem[] = customTags.map((tag: CustomTag) => ({
        name: tag.name,
        enabled: true,
        isCustom: true,
        customTagId: tag.id,
      }));

      setTags([...builtIn, ...custom]);
    } catch {
      setMessage("加载标签失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function toggleTag(index: number) {
    const updated = tags.map((tag, i) =>
      i === index ? { ...tag, enabled: !tag.enabled } : tag,
    );
    setTags(updated);

    const enabledNames = updated.filter((t) => t.enabled && !t.isCustom).map((t) => t.name);

    try {
      await getBankDataSource().updateUserSettings({ enabledCategories: enabledNames });
    } catch {
      setMessage("保存失败");
    }
  }

  async function addTag() {
    const name = newTagName.trim();

    if (!name) {
      setMessage("请输入标签名称");
      return;
    }

    if (tags.some((t) => t.name === name)) {
      setMessage("该标签已存在");
      return;
    }

    try {
      await getBankDataSource().addCustomTag(name);
      setTags((prev) => [...prev, { name, enabled: true, isCustom: true }]);
      setNewTagName("");
      setMessage("标签已添加");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "添加失败");
    }
  }

  async function removeTag(index: number) {
    const tag = tags[index];

    if (!tag.isCustom || !tag.customTagId) {
      return;
    }

    try {
      await getBankDataSource().deleteCustomTag(tag.customTagId);
      setTags((prev) => prev.filter((_, i) => i !== index));
      setMessage("标签已删除");
    } catch {
      setMessage("删除失败");
    }
  }

  async function resetAll() {
    const updated = tags.map((t) => ({ ...t, enabled: true }));
    setTags(updated);

    try {
      await getBankDataSource().updateUserSettings({ enabledCategories: [...EXPENSE_CATEGORIES] });
      setMessage("已恢复默认");
    } catch {
      setMessage("保存失败");
    }
  }

  return (
    <div ref={screenRef} className="fixed inset-0 z-[80] overflow-hidden bg-[#FFF8F1]">
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+18px)]">
        <header data-tag-screen-item className="flex h-12 shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="返回"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#C9182B] shadow-[0_6px_16px_rgba(160,80,80,0.08)] transition active:scale-95"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="text-center">
            <p className="text-[17px] font-bold leading-none text-[#2F2F2F]">标签管理</p>
          </div>
          <button
            type="button"
            onClick={resetAll}
            aria-label="恢复默认"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#C9182B] shadow-[0_6px_16px_rgba(160,80,80,0.08)] transition active:scale-95"
          >
            <RotateCcw size={18} />
          </button>
        </header>

        <section
          data-tag-screen-item
          className="no-scrollbar mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[22px] border border-[rgba(201,24,43,0.06)] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(160,80,80,0.08)]"
        >
          {/* 内置标签 */}
          <p data-tag-screen-item className="mb-2 text-[13px] font-medium text-[#4B3D3B]">
            内置分类
          </p>
          <div className="space-y-1.5">
            {tags
              .map((tag, index) => ({ tag, index }))
              .filter(({ tag }) => !tag.isCustom)
              .map(({ tag, index }) => (
                <div
                  key={tag.name}
                  data-tag-screen-item
                  className="flex items-center justify-between rounded-[14px] bg-[#FFF8F1] px-4 py-3"
                >
                  <span className="text-[14px] font-medium text-[#2F2F2F]">{tag.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleTag(index)}
                    className={`h-7 w-12 rounded-full transition ${
                      tag.enabled ? "bg-[#C9182B]" : "bg-[#EFE7E5]"
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        tag.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
          </div>

          {/* 自定义标签 */}
          {tags.some((t) => t.isCustom) ? (
            <div className="mt-4">
              <p data-tag-screen-item className="mb-2 text-[13px] font-medium text-[#4B3D3B]">
                自定义标签
              </p>
              <div className="space-y-1.5">
                {tags
                  .map((tag, index) => ({ tag, index }))
                  .filter(({ tag }) => tag.isCustom)
                  .map(({ tag, index }) => (
                    <div
                      key={tag.name}
                      data-tag-screen-item
                      className="flex items-center justify-between rounded-[14px] bg-[#FFF8F1] px-4 py-3"
                    >
                      <span className="text-[14px] font-medium text-[#2F2F2F]">{tag.name}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#C9182B] transition active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          {/* 添加标签 */}
          <div data-tag-screen-item className="mt-4">
            <p className="mb-2 text-[13px] font-medium text-[#4B3D3B]">添加自定义标签</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => {
                  setNewTagName(e.target.value.slice(0, 10));
                  setMessage("");
                }}
                placeholder="输入标签名称"
                maxLength={10}
                className="h-[42px] min-w-0 flex-1 rounded-[14px] border border-[#EFE7E5] bg-white px-4 text-[14px] text-[#2F2F2F] outline-none placeholder:text-[#B9AEAC]"
              />
              <button
                type="button"
                onClick={addTag}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#F46B7A_0%,#C9182B_100%)] text-white shadow-[0_8px_16px_rgba(201,24,43,0.16)] transition active:scale-[0.98]"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Spacer */}
          <div className="min-h-4 flex-1 shrink" />

          {/* 消息 */}
          {message ? (
            <p
              data-tag-screen-item
              className={`mt-3 shrink-0 rounded-[12px] px-3 py-1.5 text-center text-[13px] ${
                message.includes("已")
                  ? "bg-[#EAF4EC] text-[#2E7D32]"
                  : "bg-[#FCE8EA] text-[#C9182B]"
              }`}
            >
              {message}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}

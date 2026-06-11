import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Car,
  Heart,
  Home,
  Landmark,
  Plane,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Target,
} from "lucide-react";

export type GoalTypeId =
  | "travel"
  | "emergency"
  | "house"
  | "car"
  | "education"
  | "medical"
  | "shopping"
  | "retirement"
  | "custom";

export type GoalTypeField = {
  key: string;
  label: string;
  placeholder: string;
  maxLength?: number;
};

export type GoalTypeDefinition = {
  id: GoalTypeId;
  label: string;
  description: string;
  icon: LucideIcon;
  tint: { bg: string; text: string };
  fields: GoalTypeField[];
  defaultTitle: string;
};

export const GOAL_TYPES: GoalTypeDefinition[] = [
  {
    id: "travel",
    label: "旅行",
    description: "记录下一次旅行的梦想",
    icon: Plane,
    tint: { bg: "#E8F4FD", text: "#1976D2" },
    fields: [
      { key: "destination", label: "目的地", placeholder: "例如：东京、巴黎、三亚...", maxLength: 30 },
      { key: "departureDate", label: "出发日期", placeholder: "选择日期" },
    ],
    defaultTitle: "旅行基金",
  },
  {
    id: "emergency",
    label: "应急",
    description: "为意外情况做好准备",
    icon: Heart,
    tint: { bg: "#FCE8EA", text: "#C9182B" },
    fields: [],
    defaultTitle: "应急储备金",
  },
  {
    id: "house",
    label: "买房",
    description: "攒下属于自己的小窝",
    icon: Home,
    tint: { bg: "#FFF2DA", text: "#C47B1E" },
    fields: [
      { key: "location", label: "目标城市", placeholder: "例如：北京、上海...", maxLength: 20 },
      { key: "area", label: "目标面积", placeholder: "例如：80㎡", maxLength: 10 },
    ],
    defaultTitle: "买房基金",
  },
  {
    id: "car",
    label: "买车",
    description: "为出行自由努力",
    icon: Car,
    tint: { bg: "#EAF4EC", text: "#2E7D32" },
    fields: [
      { key: "model", label: "心仪车型", placeholder: "例如：特斯拉 Model 3...", maxLength: 30 },
    ],
    defaultTitle: "买车基金",
  },
  {
    id: "education",
    label: "学习",
    description: "投资自己的成长",
    icon: BookOpen,
    tint: { bg: "#F3E8FD", text: "#7B1FA2" },
    fields: [
      { key: "course", label: "课程/考试", placeholder: "例如：雅思、考研...", maxLength: 30 },
    ],
    defaultTitle: "学习基金",
  },
  {
    id: "medical",
    label: "医疗",
    description: "健康保障储备",
    icon: Stethoscope,
    tint: { bg: "#E8F8F5", text: "#00796B" },
    fields: [
      { key: "purpose", label: "用途说明", placeholder: "例如：体检、手术...", maxLength: 30 },
    ],
    defaultTitle: "医疗储备金",
  },
  {
    id: "shopping",
    label: "购物",
    description: "为心仪的物品攒钱",
    icon: ShoppingBag,
    tint: { bg: "#FFF0F5", text: "#AD1457" },
    fields: [
      { key: "item", label: "想买什么", placeholder: "例如：MacBook Pro...", maxLength: 30 },
    ],
    defaultTitle: "购物基金",
  },
  {
    id: "retirement",
    label: "养老",
    description: "为未来的自己存一份安心",
    icon: Landmark,
    tint: { bg: "#FFF8E1", text: "#F57F17" },
    fields: [],
    defaultTitle: "养老储备金",
  },
  {
    id: "custom",
    label: "自定义",
    description: "写下你自己的储蓄目标",
    icon: Sparkles,
    tint: { bg: "#FCE8EA", text: "#C9182B" },
    fields: [],
    defaultTitle: "",
  },
];

export function getGoalType(id: GoalTypeId | string): GoalTypeDefinition {
  return GOAL_TYPES.find((g) => g.id === id) ?? GOAL_TYPES[GOAL_TYPES.length - 1];
}

export function goalTypeIcon(id: GoalTypeId | string): LucideIcon {
  return getGoalType(id).icon;
}

/** Preset target amounts for quick selection */
export const PRESET_AMOUNTS = [1000, 5000, 10000, 30000, 50000, 100000] as const;

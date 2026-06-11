import type { LucideIcon } from "lucide-react";
import {
  Car,
  Home,
  Plane,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export type GoalTypeId =
  | "travel"
  | "house"
  | "car"
  | "shopping"
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

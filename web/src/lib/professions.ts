import { getProfessionById, allProfessionList } from "@/lib/coc7-data";
import type { BasicInfo } from "@/types/character";

export { getProfessionById };
export const professionList = allProfessionList;
export { toAssignedSkills } from "@/lib/coc7-rules";

export function getDisplayedProfessionName(basicInfo: Pick<BasicInfo, "professionId" | "professionMode" | "professionName">): string {
	if (basicInfo.professionMode === "custom" && basicInfo.professionName.trim()) {
		return basicInfo.professionName.trim();
	}

	return getProfessionById(basicInfo.professionId)?.name ?? "";
}
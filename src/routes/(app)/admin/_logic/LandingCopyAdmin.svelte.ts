import type { LandingCopy } from '$lib/db/schema';

export class LandingCopyAdmin {
	key: string;
	section: string;
	label: string;
	value: string = $state('');
	sortOrder: number;
	updatedAt: Date;

	constructor(copy: LandingCopy) {
		this.key = copy.key;
		this.section = copy.section;
		this.label = copy.label;
		this.value = copy.value;
		this.sortOrder = copy.sortOrder;
		this.updatedAt = copy.updatedAt;
	}

	toJSON() {
		return {
			key: this.key,
			section: this.section,
			label: this.label,
			value: this.value,
			sortOrder: this.sortOrder,
			updatedAt: this.updatedAt
		};
	}
}

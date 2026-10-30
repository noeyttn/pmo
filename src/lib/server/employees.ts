import { fail } from '@sveltejs/kit';

/** Validate the shared employee form. Returns the values or a `fail()` result. */
export function parseEmployeeForm(form: FormData) {
	const s = (k: string) => String(form.get(k) ?? '').trim();
	const values = {
		name: s('name'),
		email: s('email').toLowerCase(),
		role: (s('role') === 'admin' ? 'admin' : 'member') as 'admin' | 'member',
		position: s('position') || null,
		duties: s('duties') || null,
		level: s('level') || null,
		startDate: s('startDate') || null
	};
	if (!values.name) return { error: fail(400, { message: 'กรุณาระบุชื่อ', values }) };
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email))
		return { error: fail(400, { message: 'อีเมลไม่ถูกต้อง', values }) };
	return { values };
}

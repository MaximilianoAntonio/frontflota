/**
 * @jest-environment jsdom
 */

// Test básico sin importar componentes complejos
describe('Basic Test Suite', () => {
	test('Math operations work correctly', () => {
		expect(2 + 2).toBe(4);
		expect(3 * 3).toBe(9);
	});

	test('String operations work correctly', () => {
		expect('hello'.toUpperCase()).toBe('HELLO');
		expect('world'.length).toBe(5);
	});

	test('DOM is available', () => {
		const element = document.createElement('div');
		element.textContent = 'Hello, World!';
		expect(element.textContent).toBe('Hello, World!');
	});

	test('TextEncoder is available', () => {
		expect(TextEncoder).toBeDefined();
		const encoder = new TextEncoder();
		const encoded = encoder.encode('hello');
		expect(encoded).toBeTruthy();
		expect(encoded.length).toBeGreaterThan(0);
	});
});

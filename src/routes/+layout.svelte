<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<main class=" w-full h-full">
	{@render children()}
</main>

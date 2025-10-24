<script setup lang="ts">
</script>

<template>
    <header>
        <h1>
            <RouterLink to="/"><img src="/favicon.png">stego</RouterLink>
        </h1>
    </header>
    <nav>
        <ul>
            <li>
                <span>text</span>
                <ul>
                    <li>
                        <RouterLink to="/text/encode">encode</RouterLink>
                    </li>
                    <li>
                        <RouterLink to="/text/decode">decode</RouterLink>
                    </li>
                </ul>
            </li>
            <li>
                <span>image</span>
                <ul>
                    <li>
                        <RouterLink to="/image/encode">encode</RouterLink>
                    </li>
                    <li>
                        <RouterLink to="/image/decode">decode</RouterLink>
                    </li>
                </ul>
            </li>
        </ul>
    </nav>
    <main>
        <RouterView />
    </main>
    <footer>
        <hr />
        priyansh agrahari 2025
    </footer>
</template>

<style scoped>
h1 img {
    max-height: 1em;
    margin-right: 0.3em;
}

footer {
    text-align: center;
}
</style>

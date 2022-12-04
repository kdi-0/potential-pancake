<script lang="ts">
    import TestM from "../testM.svelte";
import Matrices from "./Matrices.svelte";
    import Primes from "./Primes.svelte";


    let topics: number = 0;
</script>

<main>
    <h1>WELCOME !</h1>
    <p>Choose one of the two main topics below</p>

    <label>
        <input type=radio bind:group={topics} name="topics" value={0}>
            Modular Arithmetic
    </label>
    <label>
        <input type=radio bind:group={topics} name="topics" value={1}>
            Primes, GCD, LCM
    </label>

    <label>
        <input type=radio bind:group={topics} name="topics" value={2}>
            Matrix Operations 
    </label>
    {#if topics === 1}
        <div id="primes">
            <h2>Primes, GCD, LCM</h2>
            <Primes/>
        </div>
        {:else if topics === 2}
        <div>
            <Matrices/>
        </div>
    {/if}
</main>

<style>
    main {
        text-align: center;
        padding: 1em;
        max-width: 240px;
        margin: 0 auto;
    }

    h1 {
        color: #ff3e00;
        text-transform: uppercase;
        font-size: 4em;
        font-weight: 100;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }
</style>

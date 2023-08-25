<script lang="ts">
    let a: number;
    let b: number;
    let _gcd: number = -1;
    let _lcm: number = -1;
    let aPrimes: number[] = [];
    let bPrimes: number[] = [];

    function listPrimes(k: number): number[] {
        let ret: number[] = [];
        for (let i = 2; i <= Math.floor(Math.sqrt(k)); i++) {
            while (k % i === 0) {
                ret.push(i);
                k /= i;
            }
        }
        if (k > 1) ret.push(k); // If what's left is a prime number larger than 1
        return ret;
    }

    function updateLists() {
        aPrimes = listPrimes(a);
        bPrimes = listPrimes(b);
        _gcd = gcd(a, b);
        _lcm = lcm(a, b);
    }

    function gcd(k: number, p: number): number {
        if (p === 0) return k;
        return gcd(p, k % p);
    }

    // lcm(a,b) * gcd(a,b)  = a*b
    function lcm(k: number, p: number): number {
        return Math.floor((k * p) / gcd(k, p));
    }
    function isButtonDisabled(field1: number, field2: number): boolean {
        return !field1 || !field2;
    }

    $: ap = aPrimes;
    $: bp = bPrimes;
</script>

<div>
    <label for="intA">Integer a: </label>
    <input
        type="number"
        id="intA"
        size="1"
        bind:value={a}
        style="max-width: 3em;"
    />
    <label for="intB">Integer b: </label>
    <input
        type="number"
        id="intB"
        size="2"
        bind:value={b}
        style="max-width: 3em;"
    />
    <h3>Inputs: a = {a}, b = {b}</h3>
    <button disabled={isButtonDisabled(a, b)} on:click={updateLists}>
        Get primes of a and b, GCD(a,b), LCM(a,b)
    </button>
    <h3>Outputs:</h3>
    <p>Prime factors of a = [{ap}]</p>
    <p>Prime factors of b = [{bp}]</p>
    <p>GCD({a},{b}) = {_gcd}</p>
    <p>LCM({a},{b}) = {_lcm}</p>
</div>

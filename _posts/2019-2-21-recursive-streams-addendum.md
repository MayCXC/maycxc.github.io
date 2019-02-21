---
title:  "Recursive streams in Java 8 addendum"
date:   2019-02-21 5:00 -0500
categories: Java jdk8 streams recursion homework addendum stack overflow
---

The results are in. I rigged up a quick nanosecond timer to compare the five
recursive directory streams from
[my last post]({% post_url 2019-2-21-recursive-streams %}),
and You Won't Believe What Happened Next.

```
Recursive method:           617245
Recursive traversal 1:      6513210
Recursive traversal 2:      2099201
Recursive traversal 3:      StackOverFlowError
Recursive stream method:    910222
```

| Times are reliable averages of the nanoseconds it took to find `calc.exe` in `System32` |

The nested and unfolded maps brought us to the higher and lower ends of ten
milliseconds. Still, the recursive method with no streams was around ten times
faster, and my favorite method threw a StackOverFlowError :(

Why and how this happened is unknown to me, which could mean a part three is
coming. The methods work fine on smaller directory structures, and traversal
three is the only one that I have seen overflow.

Oh well, better luck next time and don't worry so much.

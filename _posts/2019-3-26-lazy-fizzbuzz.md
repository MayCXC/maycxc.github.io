---
title:  "The lazy FizzBuzz: an interview interlude"
date:   2019-3-26 00:00:00 -0500
categories: Scala
tags: lazy stream circular FizzBuzz interview
---

It's internship season, and I'm on the hunt. I better know my interview
questions if I want to survive the winter. Let's start out with good old
FizzBuzz:

{% highlight scala %}
for(i <- 1 to 100) i match {
  case i if i % 15 == 0 => println("FizzBuzz")
  case i if i % 3 == 0 => println("Fizz")
  case i if i % 5 == 0 => println("Buzz")
  case i => println(i)
}
{% endhighlight %}

Crikey, a pattern matcher! Look at the product on her head! My only complaint
is that those println statements aren't very functional, we can do better:

{% highlight scala %}
(1 to 100).map{
  case i if i % 15 == 0 => "FizzBuzz"
  case i if i % 3 == 0 => "Fizz"
  case i if i % 5 == 0 => "Buzz"
  case i => i.toString
}.foreach(println)
{% endhighlight %}

A bit longer, but almost identical. Is it worth the effort? Iterating over
every number between one and one hundred misses a lot, wasting time. Time is
money, and I get paid by the hour. Cool kids will point out that FizzBuzz
prints out a pattern that repeats every fifteen iterations, which makes sense;
increasing the coefficient of one part of a sum by of the value of other will
not change the remainder of dividing by either. I think my discreet teacher
mumbled something about this last week, now I get to try it at home:

{% highlight scala %}
lazy val fizz: Stream[String] = Stream.range(0,15)
  .flatMap{
    case i if i % 15 == 0 => Some("FizzBuzz")
    case i if i % 3 == 0 => Some("Fizz")
    case i if i % 5 == 0 => Some("Buzz")
    case i => None
  }
  .append(fizz) // strong induction lmao

fizz.drop(1).take(100).foreach(println)
{% endhighlight %}

Really though, was it worth it? I can only induce so.

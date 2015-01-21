from numpy import fft
from numpy import linspace
from math import *
import matplotlib.pyplot as plt

sigma = 1.0
mu = 0.0
xs = linspace(-100, 100, 10000)
ys = [1 / (sigma * sqrt(2*pi)) * exp(-(x-mu)**2 / (2 * sigma**2)) for x in xs]
s = sum(ys)
ys = [y / s for y in ys]
res = fft.fft(ys)
res = [sqrt(r.real**2 + r.imag**2) for r in res]

plt.plot(res)
plt.show()

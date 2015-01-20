import matplotlib.pyplot as plt

line = open('out.dat').readlines()[0]
xs  = [float(x) for x in line.split()]
plt.plot(xs)
plt.show()

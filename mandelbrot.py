class Complex:
	def __init__(self, real, imag):
		self.real = real
		self.imag = imag
	def __str__(self):
		return str(round(self.real, 3)) + ' ' + str(round(self.imag, 3)) + 'i'
	def mult(self, c):
		return Complex(self.real * c.real - self.imag * self.imag, self.real * c.imag + c.real * self.imag)
	def add(self, c):
		return Complex(self.real + c.real, self.imag + c.imag)
	
def runMand(z, c, numSteps):
	#I just had to make it recursive, it's so fitting!
	if numSteps == 0:
		return z
	else :
		return runMand(z.mult(z).add(c), c, numSteps - 1)


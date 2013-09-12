import math



#all methods treat probability amplitudes as immutable

class ProbabilityAmplitude:
	def __init__(self, real, imag):
		self.real = real
		self.imag = imag
	def copy(self):
		return PA(real, imag)
	def sum(self, pAmp):
		return PA(self.real + pAmp.real, self.imag + pAmp.imag)
	def prod(self, pAmp):
		#(self.real + self.imag) * (pAmp.real + pAmp.imag)
		real = self.real * pAmp.real - self.imag * pAmp.imag
		imag = self.imag * pAmp.imag
		return PA(real, imag)
	def absSqr(self):
		return self.real * self.real + self.imag * self.imag

def PA(real, imag):
	return ProbabilityAmplitude(real, imag)
		
		
def pathProbAmp(freq, dist):
	phaseAngle = freq * dist / (2 * math.pi)
	real = math.cos(phaseAngle) / dist
	imag = math.sin(phaseAngle) / dist #feynman lectures, vol 3, chap 3, pg 4
	return PA(real, imag)
class Col:
	def __init__(self, r, g, b):
		self.r = r
		self.g = g
		self.b = b


class Ball:
	def __init__(self, r, col):
		self.r = r
		self.col = col
		self.height = 0
	def up(self, height):
		self.height+=height
	def release(self):
		print('Falling ' + str(self.height))
		self.height = 0

def makePrintFunc(str):
	def func():
		print(str)
	print('bip')
	func()
	print('bop')
	return func

	
foo = makePrintFunc('lalala')
foo()
myList = ['12', '32', '43']
myObj = {};
myObj['hello'] = 12

myBall = Ball(4, Col(100, 100, 200))

with open('myFile.txt', 'w') as f:
	f.write('hello\n')